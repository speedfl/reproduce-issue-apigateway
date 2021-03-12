import cdk = require('@aws-cdk/core');
import ec2 = require('@aws-cdk/aws-ec2');
import apigateway = require('@aws-cdk/aws-apigatewayv2');
import apigatewayIntegration = require('@aws-cdk/aws-apigatewayv2-integrations');
import elbv2 = require('@aws-cdk/aws-elasticloadbalancingv2');
import elbv2Taget = require('@aws-cdk/aws-elasticloadbalancingv2-targets');

export class ReproduceIssueApigatewayStack extends cdk.Stack {
  constructor(scope: cdk.Construct) {
    const props = { env: { account: 'account-id', region: 'eu-west-3' } };
    super(scope, 'my-app', props);

    const vpc = new ec2.Vpc(this, `VPC`, { maxAzs: 2 });


    // Create ALB
    let lb = new elbv2.ApplicationLoadBalancer(this, `LB`, {
      vpc,
      vpcSubnets: { subnets: vpc.privateSubnets },
      loadBalancerName: `myapp-ecs-lb`,
    });

    const sg = new ec2.SecurityGroup(this, 'SecurityGroupASG', {
      vpc,
      securityGroupName: `myapp-sg`,
      description: `My security group`,
      allowAllOutbound: true   // Can be set to false
    });

    // Add https listener
    const listener = lb.addListener(`HttpListener`, {
      protocol: elbv2.ApplicationProtocol.HTTP,
      port: 80,
      open: true,
    });

    const instance = new ec2.Instance(this, 'TestInstance', {
      vpc,
      instanceName: `myapp-instance`,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux(),
      securityGroup: sg,
      keyName: `cvdv-france`, 
    });

    const target = new elbv2Taget.InstanceTarget(instance, 80)

    listener.addTargets('target', {
      port: 80,
      // stickiness of 60s
      stickinessCookieDuration: cdk.Duration.seconds(60),
      targets: [
          target
      ]
  });

    const vpcLink = new apigateway.VpcLink(this, 'VPCLink', {
      vpc,
      subnets: { subnets: vpc.privateSubnets },
      securityGroups: [sg],
      vpcLinkName: `myapp-vpclink-`,
    });

    new apigatewayIntegration.HttpAlbIntegration({
      listener,
      vpcLink,
      method: apigateway.HttpMethod.ANY,
    });
    
  }
}
